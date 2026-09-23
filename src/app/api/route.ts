/** Test-project API index. No secrets. */
export async function GET() {
  return Response.json({
    ok: true,
    project: "windwrtest",
    url: "https://windwrtest.vercel.app",
  });
}
