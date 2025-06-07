import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initializeDatabase, db } from '../data/database';
import seedProducts from '../data/seed-products.json';
import { Product } from '../data/models/Product';
import { v4 as uuidv4 } from 'uuid'; // Import uuidv4

// Define the type for the raw seed data structure (before date conversion)
type SeedProduct = Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string; // ID is optional in seed data
  createdAt?: string; // Allow string dates from JSON
  updatedAt?: string;
};

interface DatabaseContextType {
  isInitialized: boolean;
  error: Error | null;
}

const DatabaseContext = createContext<DatabaseContextType>({
  isInitialized: false,
  error: null
});

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeDatabase();

        const productCount = await db.products.count();
        if (productCount === 0 && seedProducts.length > 0) {
          console.log('Products table is empty, seeding data...');
          // Explicitly type the imported JSON data
          const typedSeedProducts = seedProducts as SeedProduct[];
          const productsToSeed = typedSeedProducts.map(p => ({
            id: p.id || uuidv4(), // Ensure every product has an ID
            ...p,
            // Attempt to parse dates, default to now if invalid/missing
            createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
            updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
          })) as Product[];
          await db.products.bulkAdd(productsToSeed);
          console.log(`Seeded ${productsToSeed.length} products.`);
        } else {
          console.log(`Products table count: ${productCount}. Seeding skipped.`);
        }

        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize or seed database:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    initialize();
  }, []);

  return (
    <DatabaseContext.Provider value={{ isInitialized, error }}>
      {isInitialized ? (
        children
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold mb-4">
              {error ? 'Database Error' : 'Initializing Database...'}
            </h2>
            {error ? (
              <div className="text-error-600">
                <p className="mb-4">{error.message}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="btn btn-primary"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  return useContext(DatabaseContext);
}