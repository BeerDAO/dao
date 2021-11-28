export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'ledger': IDL.Func([], [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat))], []),
  });
};
export const init = ({ IDL }) => { return []; };
