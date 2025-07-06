import { NextPage } from 'next';

interface ErrorProps {
  statusCode?: number;
}

const Error: NextPage<ErrorProps> = ({ statusCode }) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-4">
        {statusCode ? `Error ${statusCode}` : 'An error occurred'}
      </h1>
      <p className="text-lg mb-8">
        {statusCode === 404
          ? 'The page you are looking for does not exist.'
          : 'Something went wrong on our end.'}
      </p>
      <a
        href="/"
        className="px-4 py-2 bg-black text-white rounded hover:bg-black/90"
      >
        Return Home
      </a>
    </div>
  );
};

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error; 