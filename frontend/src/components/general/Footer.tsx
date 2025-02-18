import { Link } from 'react-router-dom';

export const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer
      id="footer"
      className="mt-auto px-8 py-6 [max-600px]:py-4 border-t border-border-default dark:border-surface-subtle bg-app-bg"
    >
      <div className="flex justify-center items-center max-w-screen-xl mx-auto">
        <p className="text-lg">
          All Rights Reserved &copy; {year} <Link to="/">Castora</Link>
        </p>
      </div>
    </footer>
  );
};
