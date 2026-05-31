import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('src/app/(dashboard)/parent/page.tsx', 'utf8');

c = c.replace(
  `      // Reset form
      setFirstName(""); setLastName(""); setEmail(""); setPassword(""); setGrade("");
      onSuccess();`,
  `      // Reset form
      setFirstName(""); setLastName(""); setEmail(""); setPassword(""); setGrade("");
      // Redirect to Stripe checkout for first child
      if (data.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
        return;
      }
      onSuccess();`
);

writeFileSync('src/app/(dashboard)/parent/page.tsx', c, 'utf8');
console.log('Done');
console.log('checkoutUrl refs:', (c.match(/checkoutUrl/g) || []).length);