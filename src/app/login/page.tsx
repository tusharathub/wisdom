export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-8">
      <div className="bg-white p-10 rounded shadow max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-4">Please Log In</h1>
        <p className="mb-6 text-gray-600">Sign in to read all articles and interact.</p>
        <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          Sign In 
        </button>
      </div>
    </div>
  );
}
