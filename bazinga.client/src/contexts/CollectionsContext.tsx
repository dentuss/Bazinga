import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import {
  addToCollection,
  collectionKey,
  listCollection,
  removeFromCollection,
  type CollectionItem,
  type CollectionItemInput,
  type CollectionKind,
  type CollectionName,
} from "@/lib/collections";

type CollectionsContextType = {
  library: CollectionItem[];
  myList: CollectionItem[];
  loading: boolean;
  isSaved: (collection: CollectionName, kind: CollectionKind, contentId: string) => boolean;
  add: (collection: CollectionName, input: CollectionItemInput) => Promise<void>;
  remove: (collection: CollectionName, kind: CollectionKind, contentId: string) => Promise<void>;
  toggle: (collection: CollectionName, input: CollectionItemInput) => Promise<void>;
  reload: () => Promise<void>;
};

const CollectionsContext = createContext<CollectionsContextType | undefined>(undefined);

export const CollectionsProvider = ({ children }: { children: ReactNode }) => {
  const { token, currentProfile } = useAuth();
  const profileId = currentProfile?.id ?? null;

  const [library, setLibrary] = useState<CollectionItem[]>([]);
  const [myList, setMyList] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(false);

  const setFor = useCallback((collection: CollectionName, items: CollectionItem[]) => {
    if (collection === "library") setLibrary(items);
    else setMyList(items);
  }, []);

  const reload = useCallback(async () => {
    if (!token || profileId == null) {
      setLibrary([]);
      setMyList([]);
      return;
    }
    setLoading(true);
    try {
      const [lib, list] = await Promise.all([
        listCollection(token, profileId, "library"),
        listCollection(token, profileId, "mylist"),
      ]);
      setLibrary(lib);
      setMyList(list);
    } catch {
      setLibrary([]);
      setMyList([]);
    } finally {
      setLoading(false);
    }
  }, [token, profileId]);

  // Reload whenever the account or the active profile changes — this is what
  // makes each sub-profile keep its own Library / My List.
  useEffect(() => {
    void reload();
  }, [reload]);

  const savedKeys = useMemo(() => {
    const keys = { library: new Set<string>(), mylist: new Set<string>() };
    for (const i of library) keys.library.add(collectionKey(i.kind, i.contentId));
    for (const i of myList) keys.mylist.add(collectionKey(i.kind, i.contentId));
    return keys;
  }, [library, myList]);

  const isSaved = useCallback(
    (collection: CollectionName, kind: CollectionKind, contentId: string) =>
      savedKeys[collection].has(collectionKey(kind, contentId)),
    [savedKeys]
  );

  const add = useCallback(
    async (collection: CollectionName, input: CollectionItemInput) => {
      if (!token || profileId == null) return;
      const updated = await addToCollection(token, profileId, collection, input);
      setFor(collection, updated);
    },
    [token, profileId, setFor]
  );

  const remove = useCallback(
    async (collection: CollectionName, kind: CollectionKind, contentId: string) => {
      if (!token || profileId == null) return;
      const updated = await removeFromCollection(token, profileId, collection, kind, contentId);
      setFor(collection, updated);
    },
    [token, profileId, setFor]
  );

  const toggle = useCallback(
    async (collection: CollectionName, input: CollectionItemInput) => {
      if (isSaved(collection, input.kind, input.contentId)) {
        await remove(collection, input.kind, input.contentId);
      } else {
        await add(collection, input);
      }
    },
    [isSaved, add, remove]
  );

  return (
    <CollectionsContext.Provider
      value={{ library, myList, loading, isSaved, add, remove, toggle, reload }}
    >
      {children}
    </CollectionsContext.Provider>
  );
};

export const useCollections = () => {
  const ctx = useContext(CollectionsContext);
  if (!ctx) throw new Error("useCollections must be used within a CollectionsProvider");
  return ctx;
};
