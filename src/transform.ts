import preevaluationTransformer from './preevaluation';
import PrevalOptions from './prevalOptions';

export default (options?: PrevalOptions) => {
  return preevaluationTransformer(options || {});
};
