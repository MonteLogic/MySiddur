import {
    ClerkLoading,
    OrganizationList,
    OrganizationSwitcher,
} from "@clerk/nextjs"

const SettingsComponent: React.FC = () => {
    // Component logic here

    return (
        // Component JSX here
        <div>
            {/*  */}
            Pre-built OrganizationSwitcher
            <ClerkLoading>Loading ...</ClerkLoading>
            <OrganizationSwitcher />
        </div>
    );
};

export default SettingsComponent;




