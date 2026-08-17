import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://pkbmaskara.sch.id";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/siswa/", "/pendidik/", "/orang-tua/", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
