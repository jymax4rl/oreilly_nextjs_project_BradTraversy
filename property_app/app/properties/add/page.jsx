import PropertyAddForm from "@/components/PropertyAddForm";
import AuthGuard from "@/components/AuthGuardLoading";

const PropertyAddPage = () => {
  return (
    <AuthGuard>
      <section className="">
        <div className="container">
          <div className="bg-white shadow-md rounded-md ">
            <PropertyAddForm />
          </div>
        </div>
      </section>
    </AuthGuard>
  );
};
export default PropertyAddPage;
