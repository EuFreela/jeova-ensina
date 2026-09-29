import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { extrairErro } from '../services/api';
import Card from '../components/ui/Card';
import ErrorMessage from '../components/ui/ErrorMessage';
import InputField from '../components/ui/InputField';
import PrimaryButton from '../components/ui/PrimaryButton';
import SecondaryButton from '../components/ui/SecondaryButton';

const MIN_SENHA = 8;

const CAMPOS_VAZIOS = { atual: '', nova: '', confirmacao: '' };

export default function TrocarSenha() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, alterarSenha, logout } = useAuth();

  const [form, setForm] = useState(CAMPOS_VAZIOS);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);

  const obrigatoria = Boolean(user?.must_change_password);

  function alterar(campo) {
    return (e) => {
      setForm((atual) => ({ ...atual, [campo]: e.target.value }));
      setErros((atual) => ({ ...atual, [campo]: undefined }));
    };
  }

  function validar() {
    const novos = {};
    if (!form.atual) novos.atual = 'Informe sua senha atual.';
    if (form.nova.length < MIN_SENHA) {
      novos.nova = `A nova senha precisa ter ao menos ${MIN_SENHA} caracteres.`;
    }
    if (form.nova && form.nova === form.atual) {
      novos.nova = 'A nova senha deve ser diferente da atual.';
    }
    if (form.confirmacao !== form.nova) {
      novos.confirmacao = 'As senhas não coincidem.';
    }
    return novos;
  }

  async function enviar(e) {
    e.preventDefault();
    if (enviando) return;

    const novos = validar();
    setErros(novos);
    if (Object.keys(novos).length) return;

    setEnviando(true);
    setErroGeral('');
    try {
      await alterarSenha(form.atual, form.nova);
      navigate(location.state?.de || '/inicio', { replace: true });
    } catch (error) {
      setErroGeral(extrairErro(error, 'Não foi possível alterar a senha.'));
    } finally {
      setEnviando(false);
    }
  }

  function sair() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <span
          aria-hidden="true"
          className="grid size-14 place-items-center rounded-full bg-primary-light text-primary"
        >
          <ShieldCheck size={26} />
        </span>
        <h1 className="font-display text-2xl font-bold text-primary-dark">Defina sua senha</h1>
        <p className="text-sm text-text-muted">
          {obrigatoria
            ? 'Sua conta usa uma senha provisória. Crie uma senha pessoal para continuar.'
            : 'Atualize a senha da sua conta.'}
        </p>
      </div>

      <Card>
        <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
          <ErrorMessage>{erroGeral}</ErrorMessage>

          <InputField
            label="Senha atual"
            type="password"
            senha
            value={form.atual}
            onChange={alterar('atual')}
            erro={erros.atual}
            autoComplete="current-password"
            disabled={enviando}
          />

          <InputField
            label="Nova senha"
            type="password"
            senha
            value={form.nova}
            onChange={alterar('nova')}
            erro={erros.nova}
            dica={`Mínimo de ${MIN_SENHA} caracteres.`}
            autoComplete="new-password"
            disabled={enviando}
          />

          <InputField
            label="Confirmar nova senha"
            type="password"
            senha
            value={form.confirmacao}
            onChange={alterar('confirmacao')}
            erro={erros.confirmacao}
            autoComplete="new-password"
            disabled={enviando}
          />

          <PrimaryButton
            type="submit"
            tamanho="lg"
            larguraTotal
            carregando={enviando}
            icone={<KeyRound size={18} aria-hidden="true" />}
          >
            Salvar nova senha
          </PrimaryButton>
        </form>
      </Card>

      <SecondaryButton
        variante="fantasma"
        larguraTotal
        onClick={sair}
        icone={<LogOut size={17} aria-hidden="true" />}
      >
        {obrigatoria ? 'Sair e entrar com outra conta' : 'Sair da conta'}
      </SecondaryButton>
    </div>
  );
}
