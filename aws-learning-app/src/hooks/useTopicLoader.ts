import { useState, useEffect } from 'react';
import type { TopicConfig } from '../types/topic';
import { loadTopicConfig } from '../topics';

export function useTopicLoader(slug: string) {
  const [config, setConfig] = useState<TopicConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    loadTopicConfig(slug)
      .then(setConfig)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [slug]);

  return { config, loading, error };
}
