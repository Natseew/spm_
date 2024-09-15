export default function page() {
    const generateDateOptions = () => {
    const options = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        // Format the date as dd/mm/yyyy
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
        const year = date.getFullYear();

        options.push(
            <option key={date.toISOString()} value={`${day}/${month}/${year}`}>
                {`${day}/${month}/${year}`}
            </option>
        );
    }

    return options;
    };

return (
    <>
    <div class="flex bg-white min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
    <form>
        <h1>Filter by:</h1>
        <div>
            {/* <!-- Date Selector --> */}
            <select class="Date" id="date" name="date">
            <option value="" disabled selected>Select a date</option>
            {generateDateOptions()}
            </select>
        </div>
        <div>
          {/* <!-- Department Selector --> */}
        <select id="department" name="department">
            <option value="" disabled selected>Select a department</option>
            <option value="HR">HR</option>
            <option value="Solutioning">Solutioning</option>
            <option value="Sales">Sales</option>
            <option value="Finance">Finance</option>
            <option value="Consultancy">Consultancy</option>
            <option value="Engineering">Engineering</option>
            <option value="IT">IT</option>
        </select>
    </div>
    </form>
    </div>
</>
);
}

