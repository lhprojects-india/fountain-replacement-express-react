import { ValidationError } from '../../lib/errors.js';

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const payload = source === 'query' ? req.query : req.body;
    const result = schema.safeParse(payload);

    if (!result.success) {
      return next(
        new ValidationError('Validation failed', result.error.issues.map((issue) => ({
          path: issue.path.join('.') || source,
          message: issue.message,
        })))
      );
    }

    if (source === 'query') {
      req.validatedQuery = result.data;
    } else {
      req.validatedBody = result.data;
    }

    return next();
  };
}
