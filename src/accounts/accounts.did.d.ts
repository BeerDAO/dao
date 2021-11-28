import type { Principal } from '@dfinity/principal';
export default interface _SERVICE {
  'ledger': () => Promise<Array<[string, bigint]>>,
}
