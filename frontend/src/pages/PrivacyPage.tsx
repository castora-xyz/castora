import { useEffect } from 'react';

export const PrivacyPage = () => {
  useEffect(() => {
    document.title = 'Privacy Policy | Castora';
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold text-text-titles">Privacy Policy</h1>
      <div className="prose prose-invert dark:prose-invert max-w-none text-text-body space-y-6">
        <section>
          <h2 className="text-2xl font-semibold text-text-titles mb-4">1. Introduction</h2>
          <p>
            At Castora, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use,
            and safeguard your information when you use our decentralized prediction platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-text-titles mb-4">2. Information We Collect</h2>
          <p>As a decentralized platform, we collect minimal information:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Blockchain Data:</strong> Public blockchain transactions and wallet addresses are publicly
              available and may be indexed
            </li>
            <li>
              <strong>Usage Analytics:</strong> We may collect anonymous usage statistics to improve the platform
            </li>
            <li>
              <strong>Firebase Data:</strong> We use Firebase for storing pool metadata and user preferences (if you
              opt-in)
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-text-titles mb-4">3. How We Use Information</h2>
          <p>We use collected information to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide and improve our services</li>
            <li>Display pool information and leaderboards</li>
            <li>Analyze platform usage and performance</li>
            <li>Ensure platform security and prevent fraud</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-text-titles mb-4">4. Decentralized Nature</h2>
          <p>
            Castora is built on blockchain technology. This means:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your wallet address and transactions are publicly visible on the blockchain</li>
            <li>We do not control or store your private keys</li>
            <li>Smart contracts execute autonomously on the blockchain</li>
            <li>You are responsible for the security of your wallet</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-text-titles mb-4">5. Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Firebase:</strong> For storing pool metadata and analytics (subject to Google's Privacy Policy)
            </li>
            <li>
              <strong>Blockchain Networks:</strong> Your transactions are processed on public blockchains
            </li>
            <li>
              <strong>Web3 Providers:</strong> Wallet connections are handled by your chosen wallet provider
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-text-titles mb-4">6. Data Security</h2>
          <p>
            While we implement security measures, no method of transmission over the internet is 100% secure. We
            recommend:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Never sharing your private keys</li>
            <li>Using hardware wallets for large amounts</li>
            <li>Verifying all transactions before confirming</li>
            <li>Keeping your wallet software updated</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-text-titles mb-4">7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access your personal data stored in our systems</li>
            <li>Request deletion of your data (where applicable)</li>
            <li>Opt-out of analytics tracking</li>
            <li>Disconnect your wallet at any time</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-text-titles mb-4">8. Children's Privacy</h2>
          <p>
            Our platform is not intended for users under the age of 18. We do not knowingly collect information from
            children.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-text-titles mb-4">9. Changes to Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify users of any material changes by
            posting the new policy on this page.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-text-titles mb-4">10. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us through our Discord or X (Twitter)
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

