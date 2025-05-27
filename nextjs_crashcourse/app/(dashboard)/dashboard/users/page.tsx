import Link from 'next/link'

const page = () => {
  return (
    <div>
        <h1>Dashboard Users</h1>

        <ul className="mt-10"> {/* mt-10 adds margin-top of 2.5rem (40px) using Tailwind CSS */}
            {/* <li> is an HTML list item element used within ordered (<ol>) or unordered (<ul>) lists */}
            <li>
                <Link href="/dashboard/users/1">User 1</Link>
            </li>
            <li>
                <Link href="/dashboard/users/2">User 2</Link>
            </li>
            <li>
                <Link href="/dashboard/users/3">User 3</Link>
            </li>
            <li>
                <Link href="/dashboard/users/4">User 4</Link>
            </li>
        </ul>
    </div>
  )
}

export default page
