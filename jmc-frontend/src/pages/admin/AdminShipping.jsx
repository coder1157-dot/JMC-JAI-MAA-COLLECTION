import ModuleUnavailable from "./ModuleUnavailable";

export default function AdminShipping() {
  return (
    <ModuleUnavailable title="Shipping">
      <p>Shipping management needs a backend module that has not been built.</p>
    </ModuleUnavailable>
  );
}
