import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, Lock, LogIn, Trophy, UserRound } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { extrairErro } from '../services/api';
import BrandLogo from '../components/ui/BrandLogo';
import CenaSerena from '../components/illustrations/CenaSerena';
import BibliaAberta from '../components/illustrations/BibliaAberta';
import ErrorMessage from '../components/ui/ErrorMessage';
import InputField from '../components/ui/InputField';
import PrimaryButton from '../components/ui/PrimaryButton';

const HIGHLIGHTS = [
  { rotulo: 'Aprenda', Icone: GraduationCap },
  { rotulo: 'Jogue', Icone: LogIn },
  { rotulo: 'Compita', Icone: Trophy },
];

function validarEntrar({ usuario, senha }) {
  const erros = {};
  if (!usuario.trim()) erros.usuario = 'Informe seu nome de usuário.';
  if (!senha) erros.senha = 'Informe sua senha.';
  return erros;
}

/**
 * Tela de login (layout.md secao 4).
 * Nao ha cadastro publico: as contas sao criadas apenas pelo administrador.
 */
export default function Autenticacao() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({ usuario: '', senha: '' });
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);

  function alterar(campo) {
    return (e) => {
      setForm((atual) => ({ ...atual, [campo]: e.target.value }));
      setErros((atual) => ({ ...atual, [campo]: undefined }));
    };
  }

  async function enviar(e) {
    e.preventDefault();
    if (enviando) return;

    const novosErros = validarEntrar(form);
    setErros(novosErros);
    if (Object.keys(novosErros).length) return;

    setEnviando(true);
    setErroGeral('');

    try {
      const usuario = await login(form.usuario.trim(), form.senha);
      if (usuario?.must_change_password) {
        navigate('/trocar-senha', { replace: true });
        return;
      }
      navigate(location.state?.de || '/inicio', { replace: true });
    } catch (error) {
      setErroGeral(extrairErro(error, 'Não foi possível entrar. Tente novamente.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      {/* Fundo ilustrado + camada clara para garantir legibilidade */}
      <CenaSerena className="absolute inset-0 h-full w-full" />
      <div aria-hidden="true" className="absolute inset-0 bg-surface/72" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-center px-4 py-10 sm:py-14">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Area de marca: visivel no desktop */}
          <div className="hidden flex-col items-start gap-6 lg:flex">
            <BibliaAberta className="h-28 w-auto drop-shadow-sm" />
            <div>
              <h1 className="font-display text-4xl font-bold tracking-tight text-primary-dark">
                Jeová Ensina
              </h1>
              <p className="mt-2 text-lg text-secondary">
                Teste seu conhecimento da Palavra de Deus
              </p>
            </div>
            <ul className="flex flex-wrap gap-2.5">
              {HIGHLIGHTS.map(({ rotulo, Icone }) => (
                <li
                  key={rotulo}
                  className="flex items-center gap-2 rounded-full bg-surface/90 px-4 py-2 text-sm font-medium text-primary shadow-panel"
                >
                  <Icone size={16} className="text-primary" aria-hidden="true" />
                  {rotulo}
                </li>
              ))}
            </ul>
          </div>

          {/* Area de formulario: sempre visivel */}
          <div className="mx-auto w-full max-w-md rounded-card bg-surface p-6 shadow-raised sm:p-8">
            <div className="mb-6 flex flex-col items-center gap-2 text-center lg:hidden">
              <BrandLogo tamanho="md" />
            </div>

            <h1 className="font-display text-2xl font-bold text-primary-dark sm:text-3xl">
              Bem-vindo!
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              Entre para jogar, aprender e testar seu conhecimento das Escrituras.
            </p>

            <form onSubmit={enviar} noValidate className="mt-6 flex flex-col gap-4">
              <ErrorMessage>{erroGeral}</ErrorMessage>

              <InputField
                label="Nome de usuário"
                value={form.usuario}
                onChange={alterar('usuario')}
                erro={erros.usuario}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck="false"
                disabled={enviando}
                icone={<UserRound size={18} aria-hidden="true" />}
              />

              <InputField
                label="Senha"
                type="password"
                senha
                value={form.senha}
                onChange={alterar('senha')}
                erro={erros.senha}
                autoComplete="current-password"
                disabled={enviando}
                icone={<Lock size={18} aria-hidden="true" />}
              />

              <PrimaryButton
                type="submit"
                tamanho="lg"
                larguraTotal
                carregando={enviando}
                icone={<LogIn size={18} aria-hidden="true" />}
              >
                Entrar
              </PrimaryButton>

              <p className="text-center text-xs leading-relaxed text-text-muted">
                Não tem uma conta? O acesso é criado por um administrador.
              </p>
            </form>

            <p className="mt-6 border-t border-line pt-4 text-center text-xs leading-relaxed text-text-muted">
              Jogo baseado na Bíblia, que incentiva o conhecimento das Escrituras.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
