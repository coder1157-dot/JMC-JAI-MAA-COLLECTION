import ModuleUnavailable from "./ModuleUnavailable";

export default function AdminStores() {
  return (
    <ModuleUnavailable title="Stores">
      <p>Stores management needs a backend module that has not been built.</p>
    </ModuleUnavailable>
  );
}
