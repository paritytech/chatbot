import { distance, similarity } from 'ml-distance';


export function distances_from_embeddings(
  query_embedding: number[],
  embeddings: number[],
  distance_metric: string = "cosine"
): number {
  const distance_metrics: { [key: string]: (a: number[], b: number[]) => number } = {
    "cosine": similarity.cosine,
    "L1": distance.manhattan,
    "L2": distance.euclidean,
    "Linf": distance.chebyshev,
  };

  const distances: number =
    distance_metrics[distance_metric](query_embedding, embeddings)


  return distances;
}
