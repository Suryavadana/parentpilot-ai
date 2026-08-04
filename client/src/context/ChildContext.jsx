import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const ChildContext = createContext(null);

function ChildProvider({ children }) {
  const { token } = useAuth();
  const [childrenList, setChildrenList] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setChildrenList([]);
      setSelectedChildId(null);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    axios.get('/api/children')
      .then((response) => {
        if (cancelled) return;

        setChildrenList(response.data);
        setSelectedChildId((current) => current ?? response.data[0]?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setChildrenList([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <ChildContext.Provider
      value={{
        children: childrenList,
        selectedChildId,
        setSelectedChildId,
        loading,
        hasChildren: childrenList.length > 0,
      }}
    >
      {children}
    </ChildContext.Provider>
  );
}

function useChild() {
  const context = useContext(ChildContext);

  if (!context) {
    throw new Error('useChild must be used within a ChildProvider');
  }

  return context;
}

export { ChildProvider, useChild };
