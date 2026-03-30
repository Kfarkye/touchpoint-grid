import { TouchpointBoard } from "@/components/touchpoint-board";
import { getTouchpointBoardPayload } from "@/lib/payload-builder";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const payload = await getTouchpointBoardPayload();
  const serialized = JSON.stringify(payload).replace(/</g, "\\u003c");

  return (
    <>
      <script
        id="touchpoint-board-payload"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: serialized }}
      />
      <TouchpointBoard initialPayload={payload} />
    </>
  );
}

