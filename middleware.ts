import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Criamos a resposta base primeiro
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Atualiza cookies no request (para server components lerem)
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set({ name, value, ...options })
          )
          // Recria a resposta com o request atualizado
          supabaseResponse = NextResponse.next({ request })
          // Propaga os cookies na resposta para o browser
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: não colocar lógica entre createServerClient e getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const cookieNames = request.cookies.getAll().map(c => c.name).join(', ')
  console.log(`[MW] ${request.method} ${pathname} | user=${user?.id ?? 'null'} | cookies=[${cookieNames}]`)

  // Rota de login: redireciona para dashboard se já autenticado
  if (pathname.startsWith('/login')) {
    if (user) {
      console.log(`[MW] /login com sessão ativa → redirect /dashboard`)
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Rotas protegidas: redireciona para login se não autenticado
  if (!user) {
    console.log(`[MW] ${pathname} sem sessão → redirect /login`)
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Proteção por role (lê do user_metadata definido no Supabase Auth)
  const role = (user.user_metadata?.role as string) ?? ''

  // /pipeline — apenas admin e analyst
  if (pathname.startsWith('/pipeline') && !['admin', 'analyst'].includes(role)) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // /admin/* — apenas admin
  if (pathname.startsWith('/admin') && role !== 'admin') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Retorna a resposta com os cookies de sessão atualizados
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Ignora: _next/static, _next/image, favicon.ico e arquivos de imagem
     * Processa tudo mais (incluindo / e rotas de app)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
