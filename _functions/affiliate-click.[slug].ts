export default {
  async fetch(request: Request, env: Record<string, any>): Promise<Response> {
    const url = new URL(request.url);
    const slug = url.pathname.split('/').pop();

    if (!slug) {
      return new Response('Slug required', { status: 400 });
    }

    const supabaseUrl = env.SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    };

    // Retrieve product URL
    const productRes = await fetch(
      `${supabaseUrl}/rest/v1/affiliate_products?select=rc_product_url&slug=eq.${slug}`,
      { method: 'GET', headers }
    );

    if (productRes.status !== 200) {
      return new Response('Product not found', { status: 404 });
    }

    const productData = await productRes.json();
    if (productData.length === 0) {
      return new Response('Product not found', { status: 404 });
    }

    const rcProductUrl = productData[0].rc_product_url;

    // Log click
    await fetch(`${supabaseUrl}/rest/v1/affiliate_clicks`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        slug,
        timestamp: new Date().toISOString(),
      }),
    });

    // Redirect to product URL with FTC disclosure header
    const disclosure = 'Lien affilié — je peux toucher une commission sans coût supplémentaire pour vous';
    return new Response(null, {
      status: 302,
      headers: {
        Location: rcProductUrl,
        'X-Disclosure': disclosure,
      },
    });
  }
};