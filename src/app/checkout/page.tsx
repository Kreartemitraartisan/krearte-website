import { Suspense } from "react";
import CheckoutClient from "./checkout-client";
import Loading from "./loading";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function CheckoutPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CheckoutClient />
    </Suspense>
  );
}