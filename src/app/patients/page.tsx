import { redirect } from "next/navigation";
export default function PatientsRedirect() {
  redirect("/pharmacy/ips-principal/patients");
}