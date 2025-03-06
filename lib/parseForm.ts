import { IncomingForm, Files, Fields } from 'formidable';
import { NextApiRequest } from 'next';

export interface FormidableResult {
  fields: Fields;
  files: Files;
}

export const parseForm = async (req: NextApiRequest): Promise<FormidableResult> => {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      keepExtensions: true,
      multiples: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }
      resolve({ fields, files });
    });
  });
};
