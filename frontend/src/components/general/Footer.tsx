import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer
      id="footer"
      className="mt-auto px-8 py-6 border-t border-border-default dark:border-surface-subtle bg-app-bg"
    >
      <div className="flex justify-center items-center max-w-screen-xl mx-auto">
        <p className="text-lg">
          All Rights Reserved &copy; 2024 <Link to="/">Castora</Link>
        </p>
      </div>
    </footer>
  );
};
