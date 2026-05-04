function ErrorView({ errorType }: { errorType: string }) {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-[#E12025] text-center">
        <p className="text-xl font-semibold">
          Error loading Pokémon {errorType}
        </p>
        <p className="mt-2">Please try again later</p>
      </div>
    </div>
  );
}

export default ErrorView;
