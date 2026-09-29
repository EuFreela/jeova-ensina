import { createContext, useCallback, useContext, useRef, useState } from 'react';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const ConfirmacaoContext = createContext(null);

/**
 * Disponibiliza uma confirmacao assincrona para qualquer tela:
 *   const confirmar = useConfirmacao();
 *   if (await confirmar({ titulo: '...' })) { ... }
 */
export function ConfirmacaoProvider({ children }) {
  const [pedido, setPedido] = useState(null);
  const resolverRef = useRef(null);

  const confirmar = useCallback((opcoes) => {
    setPedido(opcoes);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const responder = useCallback((resultado) => {
    setPedido(null);
    resolverRef.current?.(resultado);
    resolverRef.current = null;
  }, []);

  return (
    <ConfirmacaoContext.Provider value={confirmar}>
      {children}
      <ConfirmDialog
        aberto={Boolean(pedido)}
        titulo={pedido?.titulo}
        descricao={pedido?.descricao}
        textoConfirmar={pedido?.textoConfirmar}
        textoCancelar={pedido?.textoCancelar}
        perigo={pedido?.perigo}
        onConfirmar={() => responder(true)}
        onCancelar={() => responder(false)}
      />
    </ConfirmacaoContext.Provider>
  );
}

export function useConfirmacao() {
  const contexto = useContext(ConfirmacaoContext);
  if (!contexto) {
    throw new Error('useConfirmacao precisa estar dentro de <ConfirmacaoProvider>');
  }
  return contexto;
}
