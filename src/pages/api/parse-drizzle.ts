import { NextApiRequest, NextApiResponse } from 'next';
import { parseDrizzleMetadata } from '@/components/Parser/Drizzle-metadata-parser';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const schema = parseDrizzleMetadata('src/components/Parser/drizzleSchema.ts');
    res.status(200).json(schema);
  } catch (error) {
    console.error('Error parsing Drizzle schema:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
