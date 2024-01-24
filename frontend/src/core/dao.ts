import { store } from "@/controller/store";


export const getCreateDAOArgs =  () => {

    try {
      
        let { kycForm, votingSettingsForm, stepsForm, contributorForm, memberForm } = store.getState().daoForm;
     
        let args = [
            parseInt(process.env.NEXT_PUBLIC_DAO_VERSION || "0"),
            kycForm.name,
            kycForm.description,
            kycForm.website,
            kycForm.email,
            kycForm.address,
            [kycForm.twitter, kycForm.discord, kycForm.telegram, kycForm.facebook],

            stepsForm.steps.map((step, index) => {
                return [
                    index,
                    step.title,
                    step.use_default_settings,
                    step.quorum,
                    step.threshold
                ]
            })
            ,

            stepsForm.steps.map((step, index) => {
                return step.step_members.map((member, m_index) => {
                    return member.address;
                })
            }),

            contributorForm.contributors.map(c => c.address),

            votingSettingsForm.quorum,
            votingSettingsForm.threshold,
            memberForm.members.map(m => m.address),
            memberForm.open,
            votingSettingsForm.allow_revoting
        ];

        return args;

    } catch (e) {
        console.log(e);
    }
    return [];

}

export const getDAOs = () => {

}