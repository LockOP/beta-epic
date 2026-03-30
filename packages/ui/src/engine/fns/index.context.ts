import { dateFnsContext }   from './date';
import { formatFnsContext } from './format';
import { cssFnsContext }    from './css';

export const FnContext = {
  ...dateFnsContext,
  ...formatFnsContext,
  ...cssFnsContext,
} as const;
