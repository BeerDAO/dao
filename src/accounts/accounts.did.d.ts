export default interface _SERVICE {
  'ledger': () => Promise<Array<[string, bigint]>>,
}
