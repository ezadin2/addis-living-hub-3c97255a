import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Bath, BedDouble, Calendar, Check, Flag, Heart, MapPin, Ruler, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/site/PageShell";
import { VerificationBadge } from "@/components/site/VerificationBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { fallbackImage, formatETB, listingImages } from "@/lib/listings";
import { listingQuery } from "@/lib/queries";
import { useFavorites } from "@/lib/favorites";

export const Route = createFileRoute("/rentals/$id")({
  loader: async ({ params, context }) => {
    const l = await context.queryClient.ensureQueryData(listingQuery(params.id));
    if (!l) throw notFound();
    return l;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — ${loaderData.neighborhood} | FaydaRent` },
          { name: "description", content: `${formatETB(loaderData.price)}/month · ${loaderData.neighborhood}, ${loaderData.city}. ${loaderData.description.slice(0, 110)}` },
          { property: "og:title", content: loaderData.title },
          { property: "og:description", content: `${formatETB(loaderData.price)}/month in ${loaderData.neighborhood}` },
          { property: "og:type", content: "website" },
          { name: "twitter:card", content: "summary_large_image" },
        ]
      : [{ title: "Listing unavailable — FaydaRent" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => (
    <PageShell>
      <div className="container-page py-24 text-center">
        <h1 className="text-2xl font-bold">This listing is no longer available</h1>
        <Button asChild variant="accent" className="mt-6"><Link to="/rentals">Browse rentals</Link></Button>
      </div>
    </PageShell>
  ),
  component: Detail,
});

const field = "mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

function Detail() {
  const l = Route.useLoaderData();
  const fav = useFavorites();
  const [img, setImg] = useState(0);
  const images = listingImages(l);
  const onImgError = (i: number) => (e: React.SyntheticEvent<HTMLImageElement>) => {
    const fb = fallbackImage(l.kind, i);
    if (e.currentTarget.src !== new URL(fb, window.location.href).href) e.currentTarget.src = fb;
  };
  return (
    <PageShell>
      <div className="container-page py-8">
        <Link to="/rentals" className="text-sm text-muted-foreground hover:text-foreground">← Back to results</Link>
        <div className="mt-4 grid gap-3 lg:grid-cols-[2fr_1fr]">
          <img key={images[img]} src={images[img] ?? images[0]} onError={onImgError(img)} alt={l.title} className="aspect-[16/10] w-full rounded-xl object-cover" />
          <div className="grid grid-cols-4 gap-3 lg:grid-cols-2">
            {images.map((s, i) => (
              <button key={i} onClick={() => setImg(i)} aria-label={`Photo ${i + 1}`} className={`overflow-hidden rounded-lg border-2 ${i === img ? "border-accent" : "border-transparent"}`}>
                <img src={s} onError={onImgError(i)} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
          <div className="min-w-0">
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase">Demo listing</span>
            <h1 className="mt-3 text-3xl font-bold">{l.title}</h1>
            <p className="mt-2 flex items-center gap-1 text-muted-foreground"><MapPin className="h-4 w-4" />{l.neighborhood}, {l.city}</p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                [BedDouble, `${l.bedrooms} bedrooms`], [Bath, `${l.bathrooms} bathrooms`],
                [Ruler, l.size_sqm ? `${l.size_sqm} m²` : "Size n/a"], [Calendar, `Min ${l.min_term} month${l.min_term > 1 ? "s" : ""}`],
              ].map(([I, t]) => { const Icon = I as typeof Bath; return (
                <div key={t as string} className="rounded-lg border border-border bg-card p-3 text-sm"><Icon className="h-4 w-4 text-accent" /><p className="mt-2 font-medium">{t as string}</p></div>
              ); })}
            </div>
            <h2 className="mt-10 text-xl font-bold">About this property</h2>
            <p className="mt-3 text-muted-foreground">{l.description}</p>
            <h2 className="mt-10 text-xl font-bold">Amenities</h2>
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {l.amenities.map((a) => <li key={a} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-accent" />{a}</li>)}
            </ul>
            <h2 className="mt-10 text-xl font-bold">Rental terms</h2>
            <dl className="mt-3 divide-y divide-border rounded-xl border border-border bg-card text-sm">
              {[["Monthly rent", formatETB(l.price)], ["Deposit", l.deposit ?? "Ask owner"], ["Furnishing", l.furnishing], ["Minimum duration", `${l.min_term} months`], ["Listed", l.created_at]].map(([k, v]) => (
                <div key={k} className="flex justify-between p-3"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium capitalize">{v}</dd></div>
              ))}
            </dl>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <p className="font-display text-2xl font-bold">{formatETB(l.price)}<span className="text-sm font-medium text-muted-foreground"> /month</span></p>
              <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary font-bold text-primary-foreground">{l.owner_name.slice(-1)}</div>
                <div><p className="font-semibold">{l.owner_name}</p><p className="text-xs text-muted-foreground">{"Owner"}</p></div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <VerificationBadge status={(l.owner_verified ? "verified" : "not_verified")} />
                {(l.status === "approved") && <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold"><ShieldCheck className="h-3.5 w-3.5" />Listing reviewed</span>}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">ID verification confirms identity, not property ownership. Contact details are shared only after you send a request.</p>
              <div className="mt-4 grid gap-2">
                <RequestDialog kind="contact" title={l.title} />
                <RequestDialog kind="viewing" title={l.title} />
                <Button variant="outline" onClick={() => fav.toggle(l.id)}><Heart className={fav.has(l.id) ? "fill-accent text-accent" : ""} />{fav.has(l.id) ? "Saved" : "Save"}</Button>
              </div>
            </div>
            <ReportDialog />
          </aside>
        </div>
      </div>
    </PageShell>
  );
}

function RequestDialog({ kind, title }: { kind: "contact" | "viewing"; title: string }) {
  const [open, setOpen] = useState(false);
  const isView = kind === "viewing";
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant={isView ? "outline" : "accent"}>{isView ? "Request a viewing" : "Contact owner"}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{isView ? "Request a viewing" : "Message the owner"}</DialogTitle></DialogHeader>
        <form className="space-y-3" onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const phone = String(fd.get("phone"));
          if (!/^(\+251|0)?9\d{8}$/.test(phone.replace(/\s/g, ""))) { toast.error("Enter a valid Ethiopian phone number, e.g. 09XX XXX XXX"); return; }
          setOpen(false);
          toast.success("Demo: request recorded locally. Real delivery arrives with accounts.", { description: title });
        }}>
          <label className="block text-sm font-medium">Your name<input name="name" required className={field} /></label>
          <label className="block text-sm font-medium">Phone<input name="phone" required placeholder="09XX XXX XXX" className={field} /></label>
          {isView && <label className="block text-sm font-medium">Preferred date<input name="date" type="date" required className={field} /></label>}
          <label className="block text-sm font-medium">Message<textarea name="msg" rows={3} className="mt-1 w-full rounded-md border border-input bg-background p-3 text-sm" defaultValue={isView ? "" : "Hello, is this property still available?"} /></label>
          <p className="text-xs text-muted-foreground">Demo mode — nothing is sent yet.</p>
          <Button type="submit" variant="accent" className="w-full">Send request</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReportDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><button className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-destructive"><Flag className="h-4 w-4" />Report suspicious listing</button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Report this listing</DialogTitle></DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); setOpen(false); toast.success("Demo: report noted. Moderation queue arrives with accounts."); }}>
          <select required className={field}><option value="">Choose a reason</option><option>Asked for payment before viewing</option><option>Fake or misleading photos</option><option>Owner identity doubts</option><option>Already rented</option></select>
          <textarea rows={3} placeholder="Details (optional)" className="w-full rounded-md border border-input bg-background p-3 text-sm" />
          <Button type="submit" variant="destructive" className="w-full">Submit report</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
