import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('src/app/(auth)/register/page.tsx', 'utf8');

const old = `    // Step 2: Auto sign-in so the user is authenticated immediately
    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (signInResult?.error) {
      // Account was created but sign-in failed — direct them to sign in manually
      setError("Account created! Please sign in to continue.");
      setLoading(false);
      router.push("/signin");
      return;
    }

    // Step 3: Redirect based on role
    // Students go to placement test to get placed
    // Parents go to their dashboard
    if (role === "STUDENT") {
      router.push("/placement");
    } else {
      router.push("/parent");
    }`;

const replacement = `    // Redirect to sign in with check-email message
    router.push("/signin?check-email=1");`;

c = c.replace(old, replacement);
writeFileSync('src/app/(auth)/register/page.tsx', c, 'utf8');
console.log('Done');