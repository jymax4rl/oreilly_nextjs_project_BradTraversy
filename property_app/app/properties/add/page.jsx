import PropertyAddForm from "@/components/PropertyAddForm";
import AuthGuard from "@/components/AuthGuardLoading";

const PropertyAddPage = () => {
  return (
    <AuthGuard>
      <section className="overflow-hidden h-auto   mx-4">
        <div className="container">
          <div className="bg-white shadow-md p-auto mt-[12vh] rounded-md ">
            <PropertyAddForm />
          </div>
        </div>
      </section>
    </AuthGuard>
  );
};
export default PropertyAddPage;
