var data = {
  project: {
    name: 'Contractor Buddy',
    focus: 'Test Driven Development',
  },
  features: [
    {
      name: 'Schedule times with slider and modal functionality.',
      description:
        'Modifying the modal to save values in a timely manner and keep them in the relevant state vicinity.',
      status: 'In Progress',
      implementation: [
        'How many files does it rely upon for it to work what are in these files which related to the feature? ',
        [
          [
            'app/main/schedule/page.tsx',
            'This is just the server file which DropdownUsersSwiper is.',
          ],
          [
            'ui/dropdown-users-swiper.tsx',
            'This is where the majority of user function is with the dropdowns as well as the skeletal structure for the <SliderComponent/>',
          ],
          [

          ]

        ],
        'On main/schedule its originally called DropdownUsersSwiper in the server component(page.tsx).  ',
      ],
    },


    {
      name: 'Route Management',
      description:
        'Adding routes and discriminating so routes are on relevant organizations.',
      status: 'In Progress',
    },
    {
      name: 'PDF Generation',
      description: 'Using pdf-lib to create and modify PDFs for timecards.',
      status: 'In Progress',
    },
    {
      name: 'Employee Management',
      description:
        'Creating a UI for remote workers to manage the company, including profile functionality.',
      status: 'Planned',
    },
  ],
  todo: [
    "Implement 'Generate Timecard' button on main/schedule",
    'Develop odometer logic',
    'Move /settings to main/settings',
    'Implement Twilio for messaging',
    "Create a 'board' explaining how each feature works",
  ],
  notes: [
    'Consider using a CLI for adding notes to the todo area',
    'Look into creating a code diagramming tool for easier project visualization',
    'Remember to create a community to help the product succeed',
    'Focus on completing current features before adding new ones',
    'Consider the perspective of a remote manager when developing features',
  ],
};
