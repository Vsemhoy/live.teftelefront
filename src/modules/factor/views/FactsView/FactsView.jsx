import { Center, Loader, Text } from '@mantine/core';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFacts } from '../../api/factorApi';
import { FactCard } from '../../components/FactCard/FactCard';
import { useFactorStore } from '../../store/factorStore';

export const FactsView = ({ pinnedOnly = false }) => {
  const [params] = useSearchParams();
  const setSearchQuery = useFactorStore((state) => state.setSearchQuery);
  const { data: facts = [], isLoading } = useFacts({ pinned: pinnedOnly });

  useEffect(() => {
    const q = params.get('q');
    if (q) setSearchQuery(q);
  }, [params, setSearchQuery]);

  if (isLoading) {
    return <Center h={300}><Loader /></Center>;
  }

  return (
    <div className="factor-shell">
      {facts.length ? (
        <div className="fact-list">
          {facts.map((fact) => <FactCard key={fact.id} fact={fact} />)}
        </div>
      ) : (
        <Center h={240}>
          <Text size="sm" c="dimmed">No facts found</Text>
        </Center>
      )}
    </div>
  );
};
