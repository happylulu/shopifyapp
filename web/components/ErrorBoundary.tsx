"use client";

import React from 'react';
import { Banner, Button, Card, BlockStack, InlineStack, Text } from '@shopify/polaris';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;

      if (Fallback && this.state.error) {
        return <Fallback error={this.state.error} retry={this.handleRetry} />;
      }

      return <DefaultErrorFallback error={this.state.error} retry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  retry: () => void;
}

function DefaultErrorFallback({ error, retry }: ErrorFallbackProps) {
  const isGraphQLError = error?.message?.includes('GraphQL') ||
                        error?.message?.includes('loyalty') ||
                        error?.message?.includes('LOYALTY_');

  return (
    <Card>
      <BlockStack gap="400">
        <Banner
          title={isGraphQLError ? "Loyalty Data Error" : "Something went wrong"}
          tone="critical"
        >
          <Text as="p">
            {isGraphQLError
              ? "We're having trouble loading your loyalty information. This might be a temporary issue."
              : "An unexpected error occurred. Please try again."
            }
          </Text>

          {process.env.NODE_ENV === 'development' && error && (
            <details style={{ marginTop: '1rem' }}>
              <summary>Error Details (Development)</summary>
              <pre style={{
                fontSize: '0.8rem',
                background: '#f6f6f7',
                padding: '1rem',
                borderRadius: '4px',
                overflow: 'auto',
                marginTop: '0.5rem'
              }}>
                {error.message}
                {error.stack && `\n\nStack trace:\n${error.stack}`}
              </pre>
            </details>
          )}
        </Banner>

        <InlineStack align="end">
          <Button onClick={retry} variant="primary">
            Try Again
          </Button>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}

// Hook for handling GraphQL errors in components
export function useErrorHandler() {
  const handleError = React.useCallback((error: any) => {
    console.error('GraphQL Error:', error);

    // You could integrate with error reporting services here
    // e.g., Sentry, LogRocket, etc.

    // For GraphQL errors, extract meaningful messages
    if (error?.response?.errors) {
      const graphqlErrors = error.response.errors;
      const errorMessages = graphqlErrors.map((err: any) => err.message).join(', ');
      console.error('GraphQL Error Messages:', errorMessages);
      return errorMessages;
    }

    return error?.message || 'An unexpected error occurred';
  }, []);

  return { handleError };
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
