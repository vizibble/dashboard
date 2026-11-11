import { Link } from 'react-router-dom';
import notFoundImg from '../../../assets/images/not-found.png';

export function NotFound() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center px-6 py-12 lg:px-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-8 lg:flex-row lg:gap-16">
        {/* Error message */}
        <section className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
          <p className="text-7xl font-bold tracking-wider text-gray-300 md:text-8xl lg:text-9xl">404</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-800 md:text-5xl lg:text-6xl">
            Page Not Found
          </h1>
          <p className="my-6 max-w-md text-lg text-gray-500 md:text-xl">
            Sorry, the page you are looking for could not be found.
          </p>
          <Link
            to="/dashboard"
            title="dashboard"
            className="bg-primary text-primary-foreground hover:bg-accent-foreground focus-visible:ring-primary inline-flex items-center gap-2 rounded-lg px-5 py-3 transition duration-150 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <span>Go Back</span>
          </Link>
        </section>

        {/* Illustration */}
        <section className="flex flex-1 items-center justify-center" aria-label="Vizibble illustration">
          <img
            src={notFoundImg}
            alt="Vizibble mascot inspecting an industrial assembly with a missing module"
            className="h-auto w-full max-w-sm object-contain md:max-w-md lg:max-w-lg"
            fetchPriority="high"
          />
        </section>
      </div>
    </main>
  );
}
