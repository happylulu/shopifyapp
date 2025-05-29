import request from "graphql-request";
import { print } from "graphql";
import { type TypedDocumentNode } from "@graphql-typed-document-node/core";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useAuthenticatedFetch } from "./useAuthenticatedFetch";

// Function to determine the correct GraphQL URL
const getGraphQLUrl = () => {
  // ALWAYS use our Next.js proxy endpoint for Tanstack Query
  // The proxy will handle authentication and forward to Shopify
  // The shopify: URL scheme only works with App Bridge's direct methods,
  // not with standard fetch/graphql-request
  return `/api/graphql`;
};

export function useGraphQL<TResult, TVariables>(
  document: TypedDocumentNode<TResult, TVariables>,
  ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
): UseQueryResult<TResult> {
  const authenticatedFetch = useAuthenticatedFetch();

  return useQuery({
    queryKey: [(document.definitions[0] as any).name.value, variables],
    queryFn: async ({ queryKey }) => {
      const url = getGraphQLUrl();

      console.log('🔍 [useGraphQL] Making request to Next.js proxy:', url);
      console.log('🔍 [useGraphQL] Variables:', queryKey[1]);

      try {
        // Extract query string from document using GraphQL print function
        const queryString = print(document);

        const requestBody = {
          query: queryString,
          variables: queryKey[1] || undefined,
        };

        console.log('🔍 [useGraphQL] Request body:', requestBody);

        // Use authenticated fetch which will include the App Bridge session token
        const response = await authenticatedFetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        console.log('🔍 [useGraphQL] Response status:', response.status);
        console.log('🔍 [useGraphQL] Response ok:', response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ [useGraphQL] HTTP error response:', errorText);
          throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const result = await response.json();
        console.log('✅ [useGraphQL] Response data:', result);

        // Check for GraphQL errors
        if (result.errors) {
          console.error('❌ [useGraphQL] GraphQL errors:', result.errors);
          throw new Error(result.errors[0]?.message || 'GraphQL error');
        }

        console.log('✅ [useGraphQL] Returning data:', result.data);
        return result.data;
      } catch (error) {
        console.error('❌ [useGraphQL] Request failed:', error);
        throw error;
      }
    },
  });
}
