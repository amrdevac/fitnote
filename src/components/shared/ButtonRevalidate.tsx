import { httpRequest } from "@/lib/httpRequest";
import { Button } from "../ui/button";

export default async function ButtonRevalidate() {
  return (
    <>
      <Button
        variant={"outline"}
        onClick={() => {
          httpRequest()
            .internal("revalidate")
            .payload({
              tag: "company-info",
            })
            .headers({
              "bamabng-pamungkas": "asdf",
            })
            .post();
        }}
      >
        Revalidate
      </Button>
    </>
  );
}
