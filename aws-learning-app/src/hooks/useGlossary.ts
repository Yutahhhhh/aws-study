import { useState } from 'react';

export function useGlossary(defaultTerm: string = 'ip-header') {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(defaultTerm);

  const open = (termId?: string) => {
    if (termId) setSelectedTerm(termId);
    setIsOpen(true);
  };

  const close = () => setIsOpen(false);

  return { isOpen, selectedTerm, open, close };
}
