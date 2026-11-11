import { getPostBySlug } from "@/lib/actions/post";
import { BlogPostDetail } from "@/components/shop/BlogPostDetail";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 60;

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const res = await getPostBySlug(slug);

  if (!res.success || !res.data) {
    return {
      title: "Artículo no encontrado | VKA POS",
      description: "El artículo solicitado no fue encontrado en VKA POS."
    };
  }

  const post = res.data;

  return {
    title: `${post.title} | VKA POS`,
    description: post.excerpt || post.title,
    openGraph: {
      title: `${post.title} | VKA POS`,
      description: post.excerpt || post.title,
      type: "article",
      publishedTime: post.createdAt ? new Date(post.createdAt).toISOString() : undefined,
      images: [post.mainImage || "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=1200"]
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || post.title,
      images: [post.mainImage || "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=1200"]
    }
  };
}

export default async function LocalizedBlogPostPage({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const res = await getPostBySlug(slug);

  if (!res.success || !res.data) {
    notFound();
  }

  return <BlogPostDetail post={res.data} locale={locale} />;
}
