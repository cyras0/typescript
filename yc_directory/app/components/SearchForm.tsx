import React from 'react'
import Form from 'next/form'
import SearchFormReset from './SearchFormReset';

const SearchForm = () => {
    const query = 'Test';

    const reset = () => {
        const form = document.querySelector('.search-form') as HTMLFormElement;
        if (form) form.reset();
    };

    return (
        <Form action="/" scroll={false} className="search-form">
            <input
                name="query"
                defaultValue={query}
                placeholder="Search Startups"
                className="search-input px-4 py-2 border rounded-md"
            />

            <div className="flex gap-2">
                {query && <SearchFormReset />}

                <button type="submit" className="search-btn text-white">
                    Search
                </button>
            </div>
        </Form>
    )
}

export default SearchForm