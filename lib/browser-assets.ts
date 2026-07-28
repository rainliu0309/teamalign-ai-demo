const DATABASE_NAME = "teamalign-local-assets";
const DATABASE_VERSION = 1;
const ASSET_STORE_NAME = "assets";

function getIndexedDb(): IDBFactory {
  if (typeof window === "undefined") {
    throw new Error(
      "TeamAlign browser asset storage is unavailable during server-side rendering. Call it from a browser client only.",
    );
  }

  if (!window.indexedDB) {
    throw new Error(
      "TeamAlign browser asset storage requires IndexedDB, but this browser does not provide it.",
    );
  }

  return window.indexedDB;
}

function storageError(action: string, cause?: unknown): Error {
  const detail =
    cause instanceof Error && cause.message ? `: ${cause.message}` : "";

  return new Error(`Failed to ${action} a TeamAlign browser asset${detail}`);
}

function openAssetDatabase(): Promise<IDBDatabase> {
  const indexedDb = getIndexedDb();

  return new Promise((resolve, reject) => {
    const request = indexedDb.open(DATABASE_NAME, DATABASE_VERSION);
    let settled = false;

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(ASSET_STORE_NAME)) {
        database.createObjectStore(ASSET_STORE_NAME);
      }
    };

    request.onsuccess = () => {
      const database = request.result;

      if (settled) {
        database.close();
        return;
      }

      settled = true;
      database.onversionchange = () => database.close();
      resolve(database);
    };

    request.onerror = () => {
      if (settled) return;
      settled = true;
      reject(storageError("open", request.error));
    };

    request.onblocked = () => {
      if (settled) return;
      settled = true;
      reject(
        new Error(
          "Failed to open TeamAlign browser asset storage because another page is blocking the database upgrade. Close other TeamAlign tabs and try again.",
        ),
      );
    };
  });
}

type AssetRequestFactory<Result> = (
  store: IDBObjectStore,
) => IDBRequest<Result>;

async function runAssetTransaction<Result>(
  mode: IDBTransactionMode,
  action: string,
  createRequest: AssetRequestFactory<Result>,
): Promise<Result> {
  const database = await openAssetDatabase();

  return new Promise((resolve, reject) => {
    let transaction: IDBTransaction;

    try {
      transaction = database.transaction(ASSET_STORE_NAME, mode);
    } catch (error) {
      database.close();
      reject(storageError(action, error));
      return;
    }

    let request: IDBRequest<Result> | undefined;
    let requestError: DOMException | null = null;
    let requestSucceeded = false;
    let result: Result;
    let settled = false;

    const fail = (cause?: unknown) => {
      if (settled) return;
      settled = true;
      database.close();
      reject(storageError(action, cause));
    };

    transaction.oncomplete = () => {
      if (settled) return;
      settled = true;
      database.close();

      if (!requestSucceeded) {
        reject(storageError(action, requestError));
        return;
      }

      resolve(result);
    };

    transaction.onerror = () => {
      fail(transaction.error ?? requestError ?? request?.error);
    };

    transaction.onabort = () => {
      fail(transaction.error ?? requestError ?? request?.error);
    };

    try {
      request = createRequest(transaction.objectStore(ASSET_STORE_NAME));
      request.onsuccess = () => {
        requestSucceeded = true;
        result = request?.result as Result;
      };
      request.onerror = () => {
        requestError = request?.error ?? null;
      };
    } catch (error) {
      settled = true;

      try {
        transaction.abort();
      } catch {
        // The transaction may already have stopped after the synchronous error.
      }

      database.close();
      reject(storageError(action, error));
    }
  });
}

export async function saveBrowserAsset(
  key: string,
  value: Blob,
): Promise<void> {
  await runAssetTransaction("readwrite", "save", (store) =>
    store.put(value, key),
  );
}

export async function getBrowserAsset(key: string): Promise<Blob | null> {
  const result = await runAssetTransaction<Blob | undefined>(
    "readonly",
    "read",
    (store) => store.get(key),
  );

  return result ?? null;
}

export async function deleteBrowserAsset(key: string): Promise<void> {
  await runAssetTransaction("readwrite", "delete", (store) =>
    store.delete(key),
  );
}
