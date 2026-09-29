import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Trophy,
  Trash2,
  UserPlus,
  UserRound,
} from 'lucide-react';
import { extrairErro } from '../services/api';
import {
  atualizarCodigo,
  criarUsuario,
  excluirUsuario,
  listarUsuarios,
  zerarPontuacao,
} from '../services/usuarios';
import { copiarTexto } from '../utils/clipboard';
import { useAuth } from '../hooks/useAuth';
import { useConfirmacao } from '../contexts/ConfirmacaoContext';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import ErrorMessage from '../components/ui/ErrorMessage';
import InputField from '../components/ui/InputField';
import LoadingState from '../components/ui/LoadingState';
import PrimaryButton from '../components/ui/PrimaryButton';
import SecondaryButton from '../components/ui/SecondaryButton';

/** Espelhando o servidor: o codigo inicial vale 5 minutos. */
const VALIDADE_CODIGO_MINUTOS = 5;

function EtiquetaPapel({ role }) {
  const admin = role === 'admin';
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        admin ? 'bg-primary-light text-primary' : 'bg-background text-secondary',
      ].join(' ')}
    >
      {admin && <ShieldCheck size={12} aria-hidden="true" />}
      {admin ? 'Administrador' : 'Jogador'}
    </span>
  );
}

function PainelCodigo(props) {
  const { usuario, codigoInicial, aoAtualizar, atualizando } = props;
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    if (await copiarTexto(codigoInicial)) {
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2500);
    } else {
      setCopiado(false);
    }
  }

  return (
    <Card variante="destaque" className="border-primary/40">
      <p className="flex items-center gap-2 font-display text-sm font-semibold text-primary">
        <KeyRound size={16} aria-hidden="true" />
        Código inicial de {usuario}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-field border border-line bg-surface px-3 py-2.5 text-center font-mono text-3xl font-bold tracking-[0.35em] text-primary-dark">
          {codigoInicial}
        </code>
        <SecondaryButton onClick={copiar} icone={copiado ? <Check size={17} /> : <Copy size={17} />}>
          {copiado ? 'Copiado' : 'Copiar'}
        </SecondaryButton>
        <SecondaryButton
          onClick={aoAtualizar}
          carregando={atualizando}
          icone={<RefreshCw size={16} aria-hidden="true" />}
          aria-label="Gerar outro código"
          title="Gerar outro código"
        >
          <span aria-hidden="true" className="sr-only">Gerar outro código</span>
        </SecondaryButton>
      </div>

      <p className="mt-3 flex items-start gap-2 rounded-field bg-error-light px-3 py-2 text-xs font-medium text-error">
        <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          Este código de 4 dígitos é a senha inicial e vale por {VALIDADE_CODIGO_MINUTOS}{' '}
          minutos. Entregue agora ao usuário: ele entra com ele e o jogo exige que crie uma
          senha definitiva logo em seguida.
        </span>
      </p>
    </Card>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const confirmar = useConfirmacao();

  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState('');
  const [aviso, setAviso] = useState('');
  const [excluindo, setExcluindo] = useState(null);
  const [zerando, setZerando] = useState(null);
  const [atualizandoCodigo, setAtualizandoCodigo] = useState(false);

  const [form, setForm] = useState({ username: '', role: 'player' });
  const [erroForm, setErroForm] = useState('');
  const [criando, setCriando] = useState(false);
  const [criado, setCriado] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErroLista('');
    try {
      setUsuarios(await listarUsuarios());
    } catch (e) {
      setErroLista(extrairErro(e, 'Não foi possível carregar os usuários.'));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function enviar(e) {
    e.preventDefault();
    if (criando) return;

    const nome = form.username.trim();
    if (nome.length < 3) {
      setErroForm('O nome de usuário precisa ter ao menos 3 caracteres.');
      return;
    }

    setCriando(true);
    setErroForm('');
    try {
      const dados = await criarUsuario({ username: nome, role: form.role });
      // A API devolve { usuario, codigoInicial, validadeMinutos }.
      // Guardamos tudo: o id e necessario para regerar o codigo depois.
      setCriado(dados);
      setForm({ username: '', role: 'player' });
      carregar();
    } catch (e) {
      setErroForm(extrairErro(e, 'Não foi possível criar o usuário.'));
    } finally {
      setCriando(false);
    }
  }

  /** Botao de atualizar: o sistema sorteia outro codigo de 4 digitos. */
  async function aoAtualizarCodigo() {
    if (!criado?.usuario?.id) return;
    setAtualizandoCodigo(true);
    setErroLista('');
    try {
      const resposta = await atualizarCodigo(criado.usuario.id);
      setCriado((atual) => ({ ...atual, codigoInicial: resposta.codigoInicial }));
      setAviso(`Novo código de ${criado.usuario.username} : ${resposta.codigoInicial}`);
    } catch (e) {
      setErroLista(extrairErro(e, 'Não foi possível gerar um novo código.'));
    } finally {
      setAtualizandoCodigo(false);
    }
  }

  async function aoExcluir(alvo) {
    const confirmado = await confirmar({
      titulo: `Excluir ${alvo.username}?`,
      descricao:
        'A conta e todo o histórico de pontuação (solo e campeonato) serão apagados. Não é possível desfazer.',
      textoConfirmar: 'Excluir',
      perigo: true,
    });
    if (!confirmado) return;

    setExcluindo(alvo.id);
    setErroLista('');
    try {
      await excluirUsuario(alvo.id);
      await carregar();
    } catch (e) {
      setErroLista(extrairErro(e, 'Não foi possível excluir o usuário.'));
    } finally {
      setExcluindo(null);
    }
  }

  async function aoZerar(alvo) {
    const confirmado = await confirmar({
      titulo: `Zerar a pontuação de ${alvo.username}?`,
      descricao:
        'Todas as partidas dele serão apagadas dos rankings Solo e Campeonato. A conta e a senha continuam como estão.',
      textoConfirmar: 'Zerar pontuação',
      perigo: true,
    });
    if (!confirmado) return;

    setZerando(alvo.id);
    setErroLista('');
    try {
      const resposta = await zerarPontuacao(alvo.id);
      setAviso(
        `Pontuação de ${alvo.username} zerada (${resposta.pontuacoesRemovidas} ${
          resposta.pontuacoesRemovidas === 1 ? 'partida removida' : 'partidas removidas'
        }).`
      );
    } catch (e) {
      setErroLista(extrairErro(e, 'Não foi possível zerar a pontuação.'));
    } finally {
      setZerando(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary-dark sm:text-3xl">
          Área administrativa
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Crie contas de jogadores. Cada nova conta recebe uma senha provisória exibida uma única
          vez.
        </p>
      </div>

      {/* Resultado da criacao: senha exibida uma vez */}
      {criado && (
        <PainelCodigo
          usuario={criado.usuario.username}
          codigoInicial={criado.codigoInicial}
          atualizando={atualizandoCodigo}
          aoAtualizar={aoAtualizarCodigo}
        />
      )}

      {aviso && (
        <p
          role="status"
          className="rounded-field border border-success/30 bg-success-light px-4 py-3 text-sm font-medium text-success"
        >
          {aviso}
        </p>
      )}

      {/* Formulario de criacao */}
      <Card className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-primary-dark">
          <UserPlus size={18} aria-hidden="true" />
          Novo usuário
        </h2>

        <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
          <ErrorMessage>{erroForm}</ErrorMessage>

          <InputField
            label="Nome de usuário"
            value={form.username}
            onChange={(e) => {
              setForm((atual) => ({ ...atual, username: e.target.value }));
              setErroForm('');
            }}
            dica="De 3 a 50 caracteres: letras, números, ponto, hífen e underscore."
            autoComplete="off"
            autoCapitalize="none"
            spellCheck="false"
            disabled={criando}
            icone={<UserRound size={18} aria-hidden="true" />}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="papel" className="text-sm font-medium text-primary-dark">
              Perfil de acesso
            </label>
            <select
              id="papel"
              value={form.role}
              onChange={(e) => setForm((atual) => ({ ...atual, role: e.target.value }))}
              disabled={criando}
              className="min-h-12 rounded-field border border-line bg-surface px-4 text-[15px] text-text transition-colors focus:border-primary focus:outline-none disabled:bg-background"
            >
              <option value="player">Jogador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <PrimaryButton
            type="submit"
            tamanho="lg"
            larguraTotal
            carregando={criando}
            icone={<UserPlus size={18} aria-hidden="true" />}
          >
            Criar usuário
          </PrimaryButton>
        </form>
      </Card>

      {/* Lista de usuarios */}
      <section aria-label="Usuários cadastrados" className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-primary-dark">
          Usuários cadastrados
        </h2>

        {carregando ? (
          <LoadingState mensagem="Carregando usuários..." />
        ) : erroLista ? (
          <div className="flex flex-col gap-3">
            <ErrorMessage>{erroLista}</ErrorMessage>
            <SecondaryButton onClick={carregar} className="self-start">
              Tentar novamente
            </SecondaryButton>
          </div>
        ) : usuarios.length === 0 ? (
          <EmptyState
            icone={<UserRound size={22} />}
            titulo="Nenhum usuário"
            descricao="Crie o primeiro usuário usando o formulário acima."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {usuarios.map((u) => {
              const souEu = u.id === user?.id;
              return (
                <li
                  key={u.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-field border border-line bg-surface px-4 py-3"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-primary-dark">
                      {u.username}
                      {souEu && <span className="ml-1.5 text-xs text-primary">(você)</span>}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-2">
                      <EtiquetaPapel role={u.role} />
                      {u.must_change_password && (
                        <span className="text-xs font-medium text-accent">
                          senha provisória
                        </span>
                      )}
                    </span>
                  </span>

                  <span className="flex items-center gap-1.5">
                    {/* Zerar pontuacao vale para todos, inclusive para a
                        propria conta do admin. */}
                    <SecondaryButton
                      tamanho="sm"
                      variante="neutro"
                      carregando={zerando === u.id}
                      icone={<Trophy size={15} aria-hidden="true" />}
                      onClick={() => aoZerar(u)}
                      title={`Zerar a pontuação de ${u.username}`}
                    >
                      Zerar pontuação
                    </SecondaryButton>

                    {/* Excluir fica so no icone e nunca na propria conta. */}
                    {souEu ? (
                      <span className="text-xs text-text-muted">sua conta</span>
                    ) : (
                      <SecondaryButton
                        tamanho="sm"
                        variante="perigo"
                        carregando={excluindo === u.id}
                        onClick={() => aoExcluir(u)}
                        aria-label={`Excluir a conta de ${u.username}`}
                        title={`Excluir a conta de ${u.username}`}
                        className="w-0 min-w-11 overflow-hidden px-0"
                      >
                        <span aria-hidden="true" className="grid place-items-center">
                          <Trash2 size={16} />
                        </span>
                      </SecondaryButton>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
