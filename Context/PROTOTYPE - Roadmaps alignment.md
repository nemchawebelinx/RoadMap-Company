
Make a project manager web application.
Before generating code, we must first discuss the GDD and the build plan.
I need 2 views: tasks and resources(assignee)
It's workload at the company level. So I don't need small tasks, but bigger initiatives and features.

Task view. 
- Use roadmap-miro for references.
- The first layer is the timeline
	- Below the months, a second row displays a continuous stream of numbered rectangles (1-31), representing every single day of the month.
	- Gray Weekdays: Style all weekdays (Monday–Friday) with a distinct gray background to separate them from the weekends.
	- Full Timeline Grid: Grid background in the main timeline area with true daily columns that align perfectly with the days in the header. The gray background for weekdays now extends all the way down the timeline, making it incredibly easy to track how long tasks are going to take!
- And after that, on the left side, we have a '+' button to add a new layer
- Layer
	- Every layer has a different colour, and its match tasks' colour in that layer
	- Layers can be configured (name, colour, description)
		- Set 20 colors
	- Layers have a command to edit and delete
	- The layer marker is on the left side and can be locked on the left side of the screen
	- In every layer, we add a smaller '+' button for adding tasks
	- Layers can be reordered (command moveUp and moveDown)
	- When tasks in the same layer overlap, move the later task below and resize the layer height.
	- **Assignee Scheduling Controls**:
	    - **Workload Allocation**: Added allocation percentage for each assignee on a task (defaulting to **100%**).
	    - **Start Day Offset**: Added relative start day offset (defaulting to **0**, representing day 0 of the task), showing the computed calendar start date in real time.
	    - **Custom Duration**: Added assignee-specific duration in days (defaulting to the remaining task duration task duration - start day), showing the computed calendar end date in real time.
	    - **Visual Timeline Preview**: The modal includes a miniature timeline preview illustrating how each assignee's portion maps within the overall task duration.
	- The number of tasks is displayed in the layer labels.
- Task
	- Every task can be configured (name, description, duration)
	- A task can be dragged to the start date and can be resized with the mouse from the right side of the task
	- Tasks have a priority mark. This mark is a full circle. The priority mark can be configured.
	- Default priority marks are: red (high), orange(mid), yellow (low)
	- Every task has assignees from the Resources View
	- Tasks can be moved to other layers
	- Layers have a command to edit
- Milestones
	- Vertical  lines are milestones; they have a flag on top with a small description 
	- Add Button is near the Milestone label
	- **Default to Today's Date**: New milestones automatically initialize with today's date (YYYY-MM-DD),
	- Milestones can be edited by clicking on the flag
	- Before Layers, add extra space for milestone flags
	- Milestones are visible on the Resources view, the same as on TaskView
	- Milestone Today is always visible, and it shows today's date on the timeline
	- Milestone has color customization (same palette color as Layers)
	- Milestones on the timeline reflect their custom color across their flag marker, stem, and vertical dashed guide line.
	- Implemented an interval-packing collision detection algorithm for timeline flags based on flag widths and horizontal positions.
		- The **Today** indicator flag is integrated into the flag collision layout.
		- The milestone row dynamically resizes to accommodate overlapping flags

Resource View
- Similar to layers in this view, we have departments (same UI as Layers)
- In every department, we add resources
- In this view, every resource has tasks from the previous view, and they are shown horizontally on the roadmap with milestones
- Resources can be configured (add picture, name, available hours, position, and notes)
- Show and hide individual resources
- **Resource View Alignment**:
	- **Accurate Assignee Duration**: The Resource view now strictly displays each task according to the specific assignee's start offset and duration, rather than the entire task window.
	- **Visual Workload Badges**: Displays the allocation percentage badge (e.g. 80%) and day span (e.g. Day 0–30 of 45d), accompanied by a proportional progress track indicating where the assignee works within the whole task.
	- **Interactive Editing**: Clicking edit on any task bar opens the modal to adjust allocations directly, and dragging or resizing within the Resource view interactively adjusts the assignee's scheduled window
- **Vertical Percentage & Cross-Hatching in Resource View**:
    - **100% Allocation**: The task bar uses the exact same layer color and opacity as in the Roadmap view across its entire vertical height.
    - **Partial Allocation (< 100%)**: The task bar splits vertically according to the percentage:
        - **Top Portion (percent%)**: Displays the identical layer color as in the Roadmap view, representing the allocated workload.
        - **Bottom Portion (100% - percent%)**: Displays a diagonal **cross-hatching** pattern (+45° and -45° intersecting lattice lines with a subtle divider) to clearly signify unallocated capacity.
        - **Allocation Badge**: Displays the specific percentage (e.g., 60%, 75%, 100%) alongside detailed hover tooltips indicating allocated vs. unallocated capacity.

Additional requirement
- Departments and layers can be hidden
	- When hidden, it goes to the end of the list; when shown, it goes back to its old position place
- When pressing '+' for a layer, task, or department. Show a pop-up in the center of the screen with appropriate params to fill.
- Layers, tasks, or departments have a command to edit
- Layers, tasks, or departments have a command to view info (additional information)
- Keep the command line (Add, Edit, Move, Delete) compact and together
- Save button saves JSON to Firestore
- Export button downloads a JSON file
- Import button imports a JSON file and sets the timeline and data
- The horizontal scroll is now configured to **automatically position today's date in the middle of the viewport on app start**.
- Add a dedicated **"Today"** button in the header to quickly jump and center Today at any time.

Zoom In/Out
- **Dynamic Timeline Scaling**: Day widths dynamically scale, automatically adjusting grid lines, weekday indicators, milestones, task stacking, and task drag/resize operations. 
- **Header & Floating Zoom Controls**: **Quick Zoom In / Out Buttons** (+ and -) with boundary detection and a quick Reset button back to 100%.        
- Separate Zoom for timeline and Vertical task size
	- **Timeline Zoom (Horizontal Scale)**: Controls the day/month timeline magnification (dayWidth), presets (Year, Quarter, Compact, Standard, Detailed, Expanded), and time horizon. Zooming out to broad periods does not shrink or collapse your cards.
	- **Card Vertical Size (Vertical Density)**: Controls card height and spacing (cardHeight, 18px to 60px) independently. Zooming in or out on the timeline will preserve your chosen card size.
- Don't add a mouse scroll shortcut
- Establish a minimum height for both Layers and Departments/Resources to ensure all text and action buttons remain visible and accessible when task card height is small.

Tech Requirements
- Use Next.js for language implementation
- The project will be hosted on the Netlify platform
- The project can be run locally
- Save changes in human-readable JSON
	- We save app state in JSON in Firestore
	- Have a JSON exporter and importer
- All secrets are kept in enc.local

- Add Firebase Authentication

