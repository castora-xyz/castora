import { useEffect } from 'react';

export const TermsPage = () => {
  useEffect(() => {
    document.title = 'Terms of Service | Castora';
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold text-text-titles">Terms of Service</h1>
      <div className="prose prose-invert dark:prose-invert max-w-none text-text-body space-y-6">
        <section>
          <h2 className="text-2xl font-semibold text-text-titles mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using Castora, you accept and agree to be bound by the terms and provision of this agreement.
            If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-text-titles mb-4">2. Description of Service</h2>
          <p>
            Castora is a decentralized prediction platform that allows users to make predictions on cryptocurrency and stock
            prices. Users can create pools, make predictions, and potentially win rewards based on the accuracy of their
            predictions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-text-titles mb-4">3. User Responsibilities</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You are responsible for maintaining the confidentiality of your wallet and private keys</li>
            <li>You agree to use the platform in compliance with all applicable laws and regulations</li>
            <li>You will not use the platform for any illegal or unauthorized purpose</li>
            <li>You are responsible for all activities that occur under your account</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-text-titles mb-4">4. Risks and Disclaimers</h2>
          <p>
            Cryptocurrency and blockchain technology involve substantial risk. By using Castora, you acknowledge that:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>You understand the risks associated with cryptocurrency transactions</li>
            <li>You are solely responsible for any losses incurred</li>
            <li>Predictions are not financial advice</li>
            <li>The platform is provided "as is" without warranties of any kind</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-text-titles mb-4">5. Limitation of Liability</h2>
          <p>
            Castora and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive
            damages resulting from your use of or inability to use the platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-text-titles mb-4">6. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Your continued use of the platform after any changes
            constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-text-titles mb-4">7. Contact Information</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us through our Discord or X (Twitter)
            channels.
          </p>
        </section>

        <p className="text-sm text-text-subtitle mt-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

