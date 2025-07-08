import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';

export default function Navbar() {
  return (
    <div className="p-4 flex justify-between">
      <h1 className="text-2xl font-bold">Wisdom Wise</h1>

      <div>
        <SignedIn>
          <UserButton />
        </SignedIn>

        <SignedOut>
          <SignInButton mode="modal">
            <button className="bg-blue-600 text-white px-4 py-2 rounded">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
      </div>
    </div>
  );
}
